"""
Playwright test execution engine
"""
import os
import json
import subprocess
import tempfile
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

class PlaywrightTestExecutor:
    def __init__(self):
        self.temp_dir = Path("temp_tests")
        self.temp_dir.mkdir(exist_ok=True)
        
    def generate_playwright_script(self, test_steps: list, test_name: str) -> str:
        """Convert JSON test steps to Playwright JavaScript code"""
        script_lines = [
            "const { test, expect } = require('@playwright/test');",
            "",
            f"test('{test_name}', async ({{ page }}) => {{",
            "  // Set default timeout",
            "  test.setTimeout(60000);",
            ""
        ]
        
        for i, step in enumerate(test_steps):
            step_type = step.get('type', '')
            selector = step.get('selector', '')
            value = step.get('value', '')
            expected = step.get('expected', '')
            timeout = step.get('timeout', 5000)
            
            script_lines.append(f"  // Step {i + 1}: {step.get('description', step_type)}")
            
            if step_type == 'navigate':
                script_lines.append(f"  await page.goto('{value}');")
                
            elif step_type == 'click':
                script_lines.append(f"  await page.click('{selector}', {{ timeout: {timeout} }});")
                
            elif step_type == 'fill':
                script_lines.append(f"  await page.fill('{selector}', '{value}');")
                
            elif step_type == 'verify':
                if expected == 'visible':
                    script_lines.append(f"  await expect(page.locator('{selector}')).toBeVisible();")
                elif expected == 'hidden':
                    script_lines.append(f"  await expect(page.locator('{selector}')).toBeHidden();")
                else:
                    script_lines.append(f"  await expect(page.locator('{selector}')).toHaveText('{expected}');")
                    
            elif step_type == 'wait':
                timeout_ms = int(value) if value.isdigit() else 1000
                script_lines.append(f"  await page.waitForTimeout({timeout_ms});")
                
            elif step_type == 'waitForSelector':
                script_lines.append(f"  await page.waitForSelector('{selector}', {{ timeout: {timeout} }});")
                
            elif step_type == 'screenshot':
                script_lines.append(f"  await page.screenshot({{ path: 'screenshot-step-{i + 1}.png' }});")
                
            script_lines.append("")
        
        script_lines.append("});")
        return "\n".join(script_lines)
    
    async def execute_test(
        self, 
        test_case: Dict[str, Any], 
        run_id: int,
        environment_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute a test case and return results"""
        test_name = test_case.get('name', f'test_{run_id}')
        test_steps = test_case.get('steps', [])
        
        # Inject environment URL if provided
        if environment_url and test_steps:
            # Update first navigate step with environment URL
            for step in test_steps:
                if step.get('type') == 'navigate':
                    step['value'] = environment_url
                    break
        
        try:
            # Generate Playwright script
            script_content = self.generate_playwright_script(test_steps, test_name)
            
            # Create temporary test file
            test_file = self.temp_dir / f"test_{run_id}.spec.js"
            with open(test_file, 'w') as f:
                f.write(script_content)
            
            # Prepare Playwright command
            cmd = [
                'npx', 'playwright', 'test',
                str(test_file),
                '--reporter=json',
                f'--output-dir=test-results-{run_id}',
                '--trace=on'
            ]
            
            # Execute test
            start_time = datetime.utcnow()
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=os.getcwd()
            )
            
            stdout, stderr = await process.communicate()
            end_time = datetime.utcnow()
            execution_time = (end_time - start_time).total_seconds()
            
            # Parse results
            result = {
                'status': 'passed' if process.returncode == 0 else 'failed',
                'execution_time': execution_time,
                'stdout': stdout.decode('utf-8') if stdout else '',
                'stderr': stderr.decode('utf-8') if stderr else '',
                'return_code': process.returncode
            }
            
            # Try to parse JSON output
            try:
                if result['stdout']:
                    json_output = json.loads(result['stdout'])
                    result['detailed_results'] = json_output
            except json.JSONDecodeError:
                pass
            
            # Check for generated files
            output_dir = Path(f'test-results-{run_id}')
            if output_dir.exists():
                # Look for screenshots
                screenshots = list(output_dir.glob('**/*.png'))
                if screenshots:
                    result['screenshot_path'] = str(screenshots[0])
                
                # Look for traces
                traces = list(output_dir.glob('**/*.zip'))
                if traces:
                    result['trace_path'] = str(traces[0])
            
            return result
            
        except Exception as e:
            logger.error(f"Test execution failed: {e}")
            return {
                'status': 'error',
                'execution_time': 0,
                'error_message': str(e),
                'stdout': '',
                'stderr': ''
            }
        finally:
            # Clean up temporary test file
            try:
                if test_file.exists():
                    test_file.unlink()
            except Exception as e:
                logger.warning(f"Failed to clean up test file: {e}")
    
    def validate_test_steps(self, steps: list) -> list:
        """Validate and normalize test steps"""
        valid_steps = []
        for step in steps:
            if not isinstance(step, dict):
                continue
                
            step_type = step.get('type', '').lower()
            if step_type not in ['navigate', 'click', 'fill', 'verify', 'wait', 'waitForSelector', 'screenshot']:
                continue
            
            valid_step = {
                'type': step_type,
                'description': step.get('description', f'{step_type} action')
            }
            
            if step_type in ['click', 'fill', 'verify', 'waitForSelector']:
                selector = step.get('selector', '')
                if not selector:
                    continue
                valid_step['selector'] = selector
            
            if step_type in ['navigate', 'fill', 'wait']:
                value = step.get('value', '')
                if not value and step_type != 'wait':
                    continue
                valid_step['value'] = value
            
            if step_type == 'verify':
                valid_step['expected'] = step.get('expected', 'visible')
            
            valid_step['timeout'] = step.get('timeout', 5000)
            valid_steps.append(valid_step)
        
        return valid_steps

# Global executor instance
test_executor = PlaywrightTestExecutor()
